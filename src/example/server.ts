import { HTTPError } from '../index.js';
import { ServerLogic } from './logic/server.js';
import { endpointInstance } from './logic/logic.js';
import { createServer } from 'http';

endpointInstance.implementation = new ServerLogic();

const server = createServer((req, res) => {
	endpointInstance
		.handleIncomingRequest(req)
		.then((result) => {
			res.writeHead(result.status, { 'Content-Type': 'application/json' });
			res.end(result.body);
		})
		.catch((error) => {
			if (error instanceof HTTPError) {
				res.writeHead(error.status, { 'Content-Type': 'text/plain' });
				res.end(error.message);
			} else {
				console.error('Internal server error', error);
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('Internal server error');
			}
		});
});

server.listen(8081, () => {
	console.log('Server is running on http://localhost:8081');
});
