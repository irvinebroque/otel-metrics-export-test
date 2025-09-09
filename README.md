# OpenTelemetry Metrics Export Test

This project demonstrates how to collect OpenTelemetry metrics from a Cloudflare Worker and export them to observability platforms like Honeycomb and Datadog.

It uses just the plain `opentelemetry-js` libraries in userspace code, with a simple exporter that exports via the Node.js Diagnostics Channel standard API. This means you can instrument your code with metrics the way you'd like to, using a standard OTEL library.

- **Main Worker** ([`src/index.ts`](https://github.com/irvinebroque/otel-metrics-export-test/blob/main/src/index.ts)): Collects OpenTelemetry metrics and publishes them via Node.js `diagnostics_channel`. It uses the vanilla opentelemetry-js library. Nothing fancy.
- **Tail Worker** ([`tail-worker/src/index.ts`](https://github.com/irvinebroque/otel-metrics-export-test/blob/main/tail-worker/src/index.ts)): Receives diagnostics channel events and forwards metrics to external observability platforms. Just plug in the sinks that you want from Datadog, Honeycomb, or Workers Analytics Engine
- **Custom DiagnosticsChannelExporter** ([`src/DiagnosticsChannelExporter.ts`](https://github.com/irvinebroque/otel-metrics-export-test/blob/main/src/DiagnosticsChannelExporter.ts)): OpenTelemetry-compatible exporter that bridges metrics to the diagnostics channel

## Get started

### 1. Install Dependencies

```bash
npm install
cd tail-worker
npm install
cd ..
```

### 2. Configure API Keys

Create a `.dev.vars` file in the `tail-worker` directory:

```bash
cd tail-worker
echo "HONEYCOMB_API_KEY=your_honeycomb_api_key_here" > .dev.vars
echo "DD_API_KEY=your_datadog_api_key_here" >> .dev.vars
```

Replace `your_honeycomb_api_key_here` and `your_datadog_api_key_here` with your actual API keys.

To add these secrets to your Worker that runs on Cloudflare, refer to the [docs](https://developers.cloudflare.com/workers/configuration/secrets/).

### 4. Run the Workers

Open two terminal windows:

**Terminal 1 - Main Worker:**
```bash
npm run dev
```

**Terminal 2 - Tail Worker:**
```bash
cd tail-worker
npm run dev
```

### 5. Generate Metrics

Make requests to your main worker to generate metrics:

```bash
curl http://localhost:8787
```

Each request will generate a metric:

- `test_up_down_counter` (counter): Random up/down counter