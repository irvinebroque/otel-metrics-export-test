/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { DiagnosticsChannelExporter } from './DiagnosticsChannelExporter';
import * as diagnosticsChannel from 'node:diagnostics_channel';

// Optional and only needed to see the internal diagnostic logging (during development)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Subscribe to metrics channel to debug
const metricsChannel = diagnosticsChannel.channel('metrics');
metricsChannel.subscribe((message: any) => {
  console.log('MAIN WORKER: Received metrics channel message:', message);
});

const { endpoint, port } = DiagnosticsChannelExporter.DEFAULT_OPTIONS;

const exporter = new DiagnosticsChannelExporter({}, () => {
  console.log(
    `diagnostics channel metrics exporter initialized`,
  );
});

// Creates MeterProvider and installs the exporter as a MetricReader
const meterProvider = new MeterProvider({
  readers: [exporter],
});
const meter = meterProvider.getMeter('example-prometheus');

// Creates metric instruments
const requestCounter = meter.createCounter('requests', {
  description: 'Example of a Counter',
});

const upDownCounter = meter.createUpDownCounter('test_up_down_counter', {
  description: 'Example of a UpDownCounter',
});

const attributes = { environment: 'staging' };

let counter = 0;
const observableCounter = meter.createObservableCounter('observable_requests', {
  description: 'Example of an ObservableCounter',
});
observableCounter.addCallback(observableResult => {
  observableResult.observe(counter, attributes);
});

const randomMetricPromise = async () =>
  new Promise(resolve =>
    setTimeout(() => resolve(Math.floor(Math.random() * 100)), 50)
  );

const observableGauge = meter.createObservableGauge(
  'observable_gauge_requests',
  {
    description: 'Example of an ObservableGauge',
  }
);
// Callbacks are run when metrics are scraped
observableGauge.addCallback(async observableResult => {
  const value = await randomMetricPromise();
  observableResult.observe(value, attributes);
});

// Note: setInterval removed from global scope due to Cloudflare Workers restrictions
// Metrics will be recorded within request handlers instead

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Record metrics for this request
		counter++;
		requestCounter.add(1, attributes);
		upDownCounter.add(Math.random() > 0.5 ? 1 : -1, attributes);
		
		// Force flush to immediately export metrics
		// await exporter.forceFlush();
		
		return new Response('Hello World!');
	},
} satisfies ExportedHandler<Env>;
