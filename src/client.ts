import { MyLogic } from './logic/logicservice.js';

const logic = new MyLogic();

logic.foo({ name: "John", age: 42 })
	.then( result => { console.log(result.message) } )
	.catch( error => { console.log('foo error', error) } );

