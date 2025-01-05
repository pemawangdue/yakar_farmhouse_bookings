from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, StictStr, validator


class BookingHistory(BaseModel):
    booking_id: str
    created_at_date_time: datetime
    event_start_date_time: datetime
    event_end_date_time: datetime
    event_type: str 
    customer_name: str = Field(min_length=1)
    customer_contact_number: str = Field(min_length=12)
    customer_contact_email: EmailStr | None = Field(default=None)
    advance_paid_amount:int = Field(default=0)
    balance_amount: int = Field(default=0)
    