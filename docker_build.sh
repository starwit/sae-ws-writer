#!/bin/bash

docker build -t starwitorg/sae-ws-writer:$(poetry version --short) .