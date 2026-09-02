# Architecture tests

**May contain:** Tests that assert the architecture itself — that the layer boundaries, the RTL
rule and the design-token rule genuinely fail lint rather than merely being documented.

**May not contain:** Feature tests. These run ESLint over synthetic source text, so they never
touch a real module.
