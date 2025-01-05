import os

def running_in_aws():
    return os.getenv("AWS_EXECUTION_ENV") is not None