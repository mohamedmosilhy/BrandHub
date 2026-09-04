# Data — orders

Implements `POST /orders`, `GET /orders`, `GET /orders/{id}` and `POST /returns`.

`GET /orders` is paged; the repository maps `content` and leaves the paging block behind, so the
domain never sees an envelope. The five fixed return reasons are turned into the API's single
free-text `reason` by `returnReasonText`, with the customer's note appended so nothing they typed
is dropped (D19).

**May contain:** `dto/`, `mappers/`, `datasources/`, `repositories/` for this slice.

**May not contain:** Leaking a DTO past the repository boundary.
