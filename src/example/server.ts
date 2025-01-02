import { FooRequest } from './logic/base.js';
import { ServerLogic } from './logic/implementation.js';
import { universalEndpoint } from './logic/service.js';

universalEndpoint.implementation = new ServerLogic();

// Exmple handler usage, this should work
universalEndpoint.handlers['/foo']
	.implementation(<FooRequest>{ name: 'John', age: 42 })
	.then((result) => {
		console.log(result);
	})
	.catch((error) => {
		console.log('foo error', error);
	});
