# Domain — orders

The `Order` entity and its status union, the four-step `orderTimeline`, the `ReturnRequest` and
its five fixed reasons, the `OrderRepository` port, and the place-order, list, detail and
request-return use cases.

`orderTimeline` maps a status onto how far the prototype's timeline has run; `CANCELLED` and
`UNKNOWN` complete no step, because neither can prove progress. BR8 — only a delivered order can
be returned — lives in `RequestReturnUseCase`, which re-reads the order rather than trusting the
status the screen was holding. `PlaceOrderUseCase` owns the D20 idempotency attempt.

**May not contain:** Any dependency outside `domain` and `core`.
