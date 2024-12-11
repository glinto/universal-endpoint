import { MyLogic } from './logic/proxy.js';

const logic = new MyLogic();

/*
function wrapMethod<I, O>(fn: (request: I) => Promise<O>, input: I): Promise<O> {
		console.log("wrap call");
		const result = fn(input);
		console.log("wrap end");
		return result;
}
*/

logic.foo({ name: "John", age: 42 })
	.then( result => { console.log(result.message) } )
	.catch( error => { console.log('foo error', error) } );

