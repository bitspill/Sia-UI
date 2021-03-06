'use strict';

// Define API calls and update DOM per call
function update() {
	// Get HostInfo regularly
	IPC.sendToHost('api-call', '/host/status', 'status');
	updating = setTimeout(update, 15000);
}
// Update host info
addResultListener('status', function(result) {
	hosting = result;
		
	// Update competitive prices
	eID('hmessage').innerHTML = 'Estimated competitive price: ' + convertSiacoin(hosting.Competition) + ' S per GB/month';

	// Calculate host finances
	var total = formatBytes(hosting.TotalStorage);
	var storage = formatBytes(hosting.TotalStorage - hosting.StorageRemaining);
	var profit = convertSiacoin(hosting.Profit).toFixed(2);
	var potentialProfit = convertSiacoin(hosting.PotentialProfit).toFixed(2);

	// Update host finances
	eID('contracts').innerHTML = hosting.NumContracts + ' Contracts';
	eID('storage').innerHTML = storage + '/' + total + ' in use';
	eID('profit').innerHTML = profit + ' S earned';
	eID('potentialprofit').innerHTML = potentialProfit + ' S to be earned';

	// From hostProperties and hidden, make properties
	hostProperties.forEach(function(prop) {
		if (eID(prop.name)) {
			return;
		}
		var item = eID('propertybp').cloneNode(true);
		item.classList.remove('hidden');
		item.querySelector('.name').textContent = prop.descr + ' (' + prop.unit + ')';
		var value = new BigNumber(hosting[prop.name].toString()).div(prop.conversion).round(2);
		item.querySelector('.value').textContent = value;
		item.id = prop.name;

		eID('properties').appendChild(item);
	});
});

// Called upon showing
function start() {
	// DEVTOOL: uncomment to bring up devtools on plugin view
	//IPC.sendToHost('devtools');

	// Start updating
	update();
}

// Called upon transitioning away from this view
function stop() {
	clearTimeout(updating);
}

// Enable buttons
eID('announce').onclick = function() {
	tooltip('Anouncing...', this);
	IPC.sendToHost('api-call', '/host/announce', 'announce');
};
addResultListener('announce', function() {
	notify('Host successfully announced!', 'announced');
});
eID('save').onclick = function() {
	tooltip('Saving...', this);

	// Define configuration settings
	var hostInfo = {};
	hostProperties.forEach(function(prop) {
		var item = eID(prop.name);
		var value = new BigNumber(item.querySelector('.value').textContent).mul(prop.conversion);
		hostInfo[prop.name.toLowerCase()] = value.round().toString();
	});
	console.log(hostInfo);

	// Define configuration call
	var call = {
		url: '/host/configure',
		type: 'GET',
		args: hostInfo,
	};
	IPC.sendToHost('api-call', call, 'configure');
};
addResultListener('configure', function() {
	update();
	notify('Hosting configuration saved!', 'saved');
});
eID('reset').onclick = function() {
	tooltip('Reseting...', this);
	hostProperties.forEach(function(prop) {
		var item = eID(prop.name);
		var value = new BigNumber(hosting[prop.name].toString()).div(prop.conversion);
		item.querySelector('.value').textContent = value;
	});
	notify('Hosting configuration reset', 'reset');
};

