import { ClientLogic, endpointInstance } from './logic/logic.js';

const logic = new ClientLogic();

endpointInstance.baseUrl = 'http://localhost:8081';

logic
	.foo({ name: 'John', age: 42 })
	.then((result) => {
		console.log(result.message);
	})
	.catch((error) => {
		console.log('foo error', error);
	});
