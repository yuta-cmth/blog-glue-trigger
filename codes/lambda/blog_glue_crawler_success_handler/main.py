import logging
import boto3
import os
import json
from datetime import datetime

# Configure a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def lambda_handler(event, context):
    print('Received event!')
    print(f'detail-type: {event["detail-type"]}')
    print(f'time: {event["time"]}')
    print(f'crawler name: {event["detail"]["crawlerName"]}')
    
