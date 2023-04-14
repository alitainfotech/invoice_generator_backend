const moment = require("moment");

const getRandomId = (min = 0, max = 500000) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	const num = Math.floor(Math.random() * (max - min + 1)) + min;
	return num.toString().padStart(6, "0");
};

exports.pdfTemplate = ({
	invoiceNumber,
	client,
	dueDate,
	balanceDue,
	user,
	items,
	total,
	currency,
	paymentDetails,
	notes,
	createdAt
}) => {
	return `
<!DOCTYPE html>
<html>
	<head>
		<style>
			.invoice-box {
				max-width: 800px;
				margin: auto;
				padding: 30px;
				border: 1px solid #eee;
				box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
				font-size: 16px;
				line-height: 24px;
				font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
				color: #555;
			}

			.column {
				float: left;
				width: 33.33%;
			  }

			.col {
				float: left;
				width: 55%;
			  }
			  .col1 {
				float: left;
				width: 15%;
			  }
			  .col2 {
				float: left;
				width: 50%;
			  }
			  
			/* Clear floats after the columns */
			.row:after {
				content: "";
				display: table;
				clear: both;
			}
			hr.custom {
				border-top: 2px solid #000;
			}

		</style>
	</head>
	<body>
		<div class="invoice-box">
			<div class="row">
				<div class="column">
					<img src="https://fastly.picsum.photos/id/866/200/300.jpg?hmac=rcadCENKh4rD6MAp6V_ma-AyWv641M4iiOpe1RyFHeI" style="width: 100%; max-width: 200px" />
				</div>
				<div class="column" style="line-height: 1.8;">
					<strong style="font-size:25px">${client.name}</strong><br />
					<strong>Business Number :</strong> ${client.businessNo} <br />
					${client.address}<br />
					${client.phone}<br />
					${client.email}
				</div>
				<div class="column" style="text-align:right; line-height: 2.0;">
					<strong style="font-size:20px">Invoice</strong><br />
					#${invoiceNumber}<br />
					<strong>Date</strong><br />
					${moment(createdAt).format("MMM DD, YYYY")}<br />
					<strong>Due</strong><br />
					${moment(dueDate).format("MMM DD, YYYY")}<br />
					<strong>Balance Due</strong><br />
					&#8377;${balanceDue}<br />
				</div>
			</div>
			<hr class="solid">
			<div class="row" style="line-height: 1.8;">
			  	Bill To<br />
			  	<span style="font-size:25px">${user.name}</span><br />
			  	${user.address}<br />
			  	${user.phone}<br />
			  	${user.email}
			</div><br /><br />
			<hr class="custom">
			<div class="row" style="font-weight: bold;">
				<div class="col">DESCRIPTION</div>
				<div class="col1">RATE</div>
				<div class="col1">QTY</div>
				<div class="col1">AMOUNT</div>
			</div>
			<hr class="custom">
			${items.map((item, i) =>
		`<div class="row" key=${i}>
					<div class="col">${item.itemName}</div>
					<div class="col1">&#8377;${item.unitPrice}</div>
					<div class="col1">${item.quantity}</div>
					<div class="col1">&#8377;${item.unitPrice * item.quantity}</div>
				</div><hr class="solid">`
	).join('')}
	<br /><br />
	  		<div class="row">
			  	<div class="col2">&nbsp;</div>
				<div class="col2">
					<div class="row">
						<div class="col2" style="font-weight: bold;">Total</div>
						<div class="col2" style="text-align: right;">&#8377;${total}</div>
					</div>
					<div class="row">
						<div class="col2" style="font-weight: bold;">Paid</div>
						<div class="col2" style="text-align: right;">-&#8377;${paymentDetails.amountPaid}</div>
					</div>
					<hr class="solid">
					<div class="row">
						<div class="col2" style="font-weight: bold;">Balance Due</div>
						<div class="col2" style="text-align: right;">${currency} &#8377;${total - paymentDetails.amountPaid}</div>
					</div>
				</div>
	  		</div>
		</div>
  	</body>
</html>`;
};
