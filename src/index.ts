import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { DiagnosticsChannelExporter } from './DiagnosticsChannelExporter';

const exporter = new DiagnosticsChannelExporter({});
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
