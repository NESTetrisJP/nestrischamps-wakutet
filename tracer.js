import tracer from 'dd-trace';

tracer.init({
	runtimeMetrics: true,
	logInjection: true, // https://docs.datadoghq.com/tracing/other_telemetry/connect_logs_and_traces/nodejs/
});

tracer.use('express', {
	middleware: true,
});

tracer.use('pg', {
	service: 'pg',
});

export default tracer;
