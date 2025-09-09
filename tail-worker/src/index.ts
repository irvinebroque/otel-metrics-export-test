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

// TODO — why is this necessary? Because it's a class and something in local dev doesn't expect a class but a POJO?
export default {
    tail: tailExporter.tail.bind(tailExporter)
};