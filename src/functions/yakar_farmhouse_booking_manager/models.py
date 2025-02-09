from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, StrictStr, validator


class BookingHistory(BaseModel):
    booking_id: str
    created_at_date_time: datetime
    event_start_date_time: datetime
    event_end_date_time: datetime
    event_type: StrictStr 
    customer_name: StrictStr = Field(min_length=1)
    customer_contact_number: int = Field(min_length=10)
    customer_contact_email: EmailStr = Field(default=None)
    advance_paid_amount:int = Field(default=0)
    balance_amount: int = Field(default=0)
    