import logging
import signal
import threading

from prometheus_client import Counter, Histogram, start_http_server
from visionlib.pipeline.consumer import RedisConsumer
from visionlib.pipeline.publisher import RedisPublisher
from visionapi.messages_pb2 import SaeMessage

from .config import MyStageConfig
from websockets.sync.server import serve
from threading import Thread
from collections import deque
from google.protobuf.json_format import MessageToJson
import time

logger = logging.getLogger(__name__)

REDIS_PUBLISH_DURATION = Histogram('my_stage_redis_publish_duration', 'The time it takes to push a message onto the Redis stream',
                                   buckets=(0.0025, 0.005, 0.0075, 0.01, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.25))
FRAME_COUNTER = Counter('my_stage_frame_counter', 'How many frames have been consumed from the Redis input stream')

stop_event = threading.Event()
msg_queue = deque(maxlen=10)

def ws_conn_handler(websocket):
    logger.info("client connection")
    while not stop_event.is_set():
        try:
            msg = msg_queue.popleft()
            sae_msg = SaeMessage()
            sae_msg.ParseFromString(msg)
            logger.info("Sending message")
            websocket.send(MessageToJson(sae_msg))
        except IndexError:
            time.sleep(0.01)

def ws_thread(server):
    server.serve_forever()


def run_stage():

    # Register signal handlers
    def sig_handler(signum, _):
        signame = signal.Signals(signum).name
        print(f'Caught signal {signame} ({signum}). Exiting...')
        stop_event.set()

    signal.signal(signal.SIGTERM, sig_handler)
    signal.signal(signal.SIGINT, sig_handler)

    # Load config from settings.yaml / env vars
    CONFIG = MyStageConfig()

    logger.setLevel(CONFIG.log_level.value)

    logger.info(f'Starting prometheus metrics endpoint on port {CONFIG.prometheus_port}')

    start_http_server(CONFIG.prometheus_port)

    logger.info(f'Starting geo mapper stage. Config: {CONFIG.model_dump_json(indent=2)}')

    consume = RedisConsumer(CONFIG.redis.host, CONFIG.redis.port, 
                            stream_keys=[f'{CONFIG.redis.input_stream_prefix}:{CONFIG.redis.stream_id}'])
    publish = RedisPublisher(CONFIG.redis.host, CONFIG.redis.port)

    
    with consume, publish, serve(ws_conn_handler, host="localhost", port=12345) as ws_server:
        ws_thread_handle = Thread(target=ws_thread, args=(ws_server,))
        ws_thread_handle.start()

        for stream_key, proto_data in consume():
            if stop_event.is_set():
                break

            if stream_key is None:
                continue

            msg_queue.append(proto_data)
        
        ws_server.shutdown()