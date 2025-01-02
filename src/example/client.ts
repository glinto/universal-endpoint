import { ClientLogic, universalEndpoint } from './logic/service.js';

const logic = new ClientLogic();

universalEndpoint.baseUrl = 'http://localhost:8081';

logic
	.foo({ name: 'John', age: 42 })
	.then((result) => {
		console.log(result.message);
	})
	.catch((error) => {
		console.log('foo error', error);
	});
