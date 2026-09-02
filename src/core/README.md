# Core — shared kernel

**May contain:** `Result`, the `AppError` hierarchy, `Money`, and small pure types used by every layer.

**May not contain:** Imports from any other layer. Anything that is not needed by at least two layers. This is not a `utils` folder.
