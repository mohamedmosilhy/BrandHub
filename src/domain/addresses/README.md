# Domain — addresses

The `Address` entity, its `City` value object, the `AddressRepository` port and the save,
set-default and delete use cases.

The entity is the shape the UI collects — label, recipient name, phone, details and city — so no
visible field is lost on the way to an API that has fields for none of the first two (D13). BR7
lives in `SetDefaultAddressUseCase`, which returns the whole list rather than one address, because
"exactly one default" is a statement about the list. The Omani phone rule is
`@domain/identity`'s `createPhoneNumber`, not a second copy of it.

**May not contain:** Any dependency outside `domain` and `core`.
