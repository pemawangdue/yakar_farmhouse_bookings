
import uuid
import logging
from fastapi import FastAPI, Request, status
from mangum import Mangum
from frameworks.dynamodb import DynamoDB


logger = logging.getLogger("root")
API_V1: str = "v1"
REQUEST_ID_HEADER = "X-API-RequestId"

app = FastAPI(
    title="Yakar Farmhouse Bookings management API",
    root_path="/prod" if running_in_aws() else None
)

@app.middleware("http")
async def request_id_and_logging_setup(request: Request, call_next):
    request_id = find_or_generate_request_id(request)
    request.state.request_id = request_id
    logger.infof("HTTP {request.method} to {request.url} with request_id={request_id} and request_header={request.headers}")
    response = call_next(request)
    response.headers[REQUEST_ID_HEADER] = request_id
    return response

def find_or_generate_request_id(request):
    request_id: str = request.headers.get(REQUEST_ID_HEADER)
    if request_id:
        return request_id
    if running_in_aws():
        lambda_context = request.scope["aws.context"] # provided by Mangum
        lambda_request_id = lambda_context.aws_request_id
        if lambda_request_id:
            return lambda_request_id
    return uuid.uuid().__str__()

@app.get("/hello-world")
def hello_world():
    return {"message": "Hello World"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", reload=True, access_log=False)