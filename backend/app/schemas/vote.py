from pydantic import BaseModel


class VoteToggleResponseSchema(BaseModel):
    voted: bool
    useful_count: int
