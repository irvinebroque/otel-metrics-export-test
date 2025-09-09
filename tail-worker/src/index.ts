import { env } from 'cloudflare:workers';
import {
    DatadogMetricSink,
    TailExporter,
    WorkersAnalyticsEngineSink,
    OtelMetricSink,
    OtelLogSink,
} from '@flarelabs-net/workers-observability-utils/tail';

// Create the TailExporter instance
const tailExporter = new TailExporter({
    metrics: {
        sinks: [
            new DatadogMetricSink({
                site: 'us3.datadoghq.com',
                apiKey: env.DD_API_KEY,
            }),
            new OtelMetricSink({
                url: 'https://api.honeycomb.io',
                headers: {
                    'x-honeycomb-team': env.HONEYCOMB_API_KEY,
                    'x-honeycomb-dataset': 'metrics',
                },
                enableNanoSecondTimestampJitter: true,
                enableIsolateId: true,
            }),
        ],
        maxBufferSize: 10,
        maxBufferDuration: 1,
    },
    logs: {
        sinks: [
            new OtelLogSink({
                url: 'https://api.honeycomb.io',
                headers: {
                    'x-honeycomb-team': env.HONEYCOMB_API_KEY,
                    'x-honeycomb-dataset': 'metrics',
                },
            }),
        ],
    },
});

// Export the tail function explicitly for Cloudflare Workers
export default {
    tail: tailExporter.tail.bind(tailExporter)
};