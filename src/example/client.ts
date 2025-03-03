import { wrapRequest } from '../index.js';
import { ClientLogic, endpointInstance } from './logic/logic.js';

const logic = new ClientLogic();

endpointInstance.baseUrl = 'http://localhost:8081';

logic
	.foo({ name: 'John Doe', age: 42 })
	.then((result) => {
		console.log(result.message);
	})
	.then(() => logic.primitiveNumber(42))
	.then((result) => {
		console.log(result);
	})
	.then(() => logic.max(wrapRequest([1, 2, 7, 4, 5], { Authorization: 'Bearer xyz' })))
	.then((result) => {
		console.log(result);
	})
	.then(() => logic.bar())
	.then((result) => {
		console.log(result);
	})
	.catch((error) => {
		console.log('foo error', error);
	});
