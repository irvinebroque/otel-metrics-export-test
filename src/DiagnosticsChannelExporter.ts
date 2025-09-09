import { MetricReader } from '@opentelemetry/sdk-metrics';
import { CollectionResult, DataPoint, DataPointType, MetricData, ScopeMetrics } from '@opentelemetry/sdk-metrics';
import { Attributes } from '@opentelemetry/api';
import * as diagnosticsChannel from 'node:diagnostics_channel';

interface MetricPayload {
  type: 'COUNT' | 'GAUGE';
  name: string;
  value: number;
  tags: Record<string, string>;
}

export class DiagnosticsChannelExporter extends MetricReader {
  static readonly DEFAULT_OPTIONS = {
    host: undefined,
    port: 9464,
    endpoint: '/metrics',
    prefix: '',
    appendTimestamp: false,
    withResourceConstantLabels: undefined,
  };

  private readonly _metricsChannel: diagnosticsChannel.Channel;
  private readonly _prefix?: string;
  private _collectTimer?: NodeJS.Timeout;

  constructor(config: { prefix?: string } = {}, callback?: (error: Error | void) => void) {
    super();
    this._prefix = config.prefix;
    this._metricsChannel = diagnosticsChannel.channel('metrics');
    
    console.log('DiagnosticsChannelExporter initialized');
    
    // Call callback immediately since we don't need to start a server
    if (callback) {
      process.nextTick(() => callback());
    }
  }

  // Flush metrics with ExecutionContext waitUntil
  public flush(ctx: ExecutionContext): void {
    ctx.waitUntil(this.forceFlush());
  }

  protected async onForceFlush(): Promise<void> {
    // Collect and publish metrics immediately
    const result = await this.collect();
    this._publishMetrics(result);
  }

  protected async onShutdown(): Promise<void> {
    // Nothing to clean up for diagnostics channel
  }

  private _publishMetrics(collectionResult: CollectionResult): void {
    for (const scopeMetrics of collectionResult.resourceMetrics?.scopeMetrics || []) {
      for (const metricData of scopeMetrics.metrics) {
        console.log('Processing metric:', metricData.descriptor.name, 'dataPoints:', metricData.dataPoints.length);
        this._processMetric(metricData);
      }
    }
  }

  private _processMetric(metricData: MetricData): void {
    const metricName = this._prefix ? `${this._prefix}${metricData.descriptor.name}` : metricData.descriptor.name;
    
    for (const dataPoint of metricData.dataPoints) {
      const tags = this._attributesToTags(dataPoint.attributes);
      this._publishMetric('COUNT', metricName, dataPoint.value as number, tags);
    }
  }

  private _publishMetric(type: 'COUNT' | 'GAUGE', name: string, value: number, tags: Record<string, string>): void {
    const payload: MetricPayload = {
      type,
      name,
      value,
      tags,
    };

    console.log('Publishing metric to diagnostics channel:', payload);
    this._metricsChannel.publish(payload);
  }

  private _attributesToTags(attributes: Attributes): Record<string, string> {
    const tags: Record<string, string> = {};
    for (const [key, value] of Object.entries(attributes)) {
      tags[key] = String(value);
    }
    return tags;
  }
}