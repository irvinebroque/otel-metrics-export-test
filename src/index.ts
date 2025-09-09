import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { DiagnosticsChannelExporter } from './DiagnosticsChannelExporter';
import * as diagnosticsChannel from 'node:diagnostics_channel';

// All normal vanilla OTEL lib
// Only difference is we use the DiagnosticsChannelExporter to export the metrics to the diagnostics channel
// Actual export of metrics happens in the tail worker

// DEBUG ONLY
// Optional and only needed to see the internal diagnostic logging (during development)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Subscribe to metrics channel to debug
const metricsChannel = diagnosticsChannel.channel('metrics');
metricsChannel.subscribe((message: any) => {
  console.log('MAIN WORKER: Received metrics channel message:', message);
});
// END DEBUG ONLY

const exporter = new DiagnosticsChannelExporter({}, () => {
  console.log(
    `diagnostics channel metrics exporter initialized`,
  );
});

const meterProvider = new MeterProvider({
  readers: [exporter],
});
const meter = meterProvider.getMeter('example-otel');

const upDownCounter = meter.createUpDownCounter('test_up_down_counter', {
  description: 'Example of a UpDownCounter',
});

const attributes = { environment: 'staging', some: 'metadata' };

export default {
	async fetch(request, env, ctx): Promise<Response> {
		upDownCounter.add(Math.random() > 0.5 ? 1 : -1, attributes);
		
		// Call this to ensure metrics are flushed
		exporter.flush(ctx);
		
		return new Response('Hello World!');
	},
} satisfies ExportedHandler<Env>;
