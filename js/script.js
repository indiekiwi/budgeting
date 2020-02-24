var idx = 0;
var data = {};

const
    WEEKDAYS                = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    MONTHS                  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    FREQUENCY_ONE_OFF       = 'One Off',
    FREQUENCY_DAILY         = 'Daily',
    FREQUENCY_WEEKLY        = 'Weekly',
    FREQUENCY_FORTNIGHTLY   = 'Fortnightly',
    FREQUENCY_MONTHLY       = 'Monthly',
    FREQUENCY_YEARLY        = 'Yearly',
    FREQUENCY_EVERY_X_DAYS  = 'Every X Days';

$(document).ready(function () {
    resetForm();

    var defaultDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    document.getElementById("projectTill").valueAsDate = defaultDate;
});
$('#projectTill').change(function () {
    updateTable()
});
$('#cancelTransactionRowButton').on('click', function (event) {
    resetForm();
});
$('#addTransactionRowButton').on('click', function (event) {
    event.preventDefault();

    var modifyId = document.getElementById("formId").value;
    var table = document.getElementById("tableSettings");
    var updateIndex = 0;
    if (modifyId > 0) {
        // Modify
        updateIndex = modifyId;
        var table = document.getElementById("tableSettings");
        for (var r = 0, row; row = table.rows[r]; r++) {
            if (row.cells.item(4) !== null && row.cells.item(0).innerText == modifyId) {
                var c0 = row.cells.item(0);
                var c1 = row.cells.item(1);
                var c2 = row.cells.item(2);
                var c3 = row.cells.item(3);
                var c4 = row.cells.item(4);
            }
        }
    } else {
        // Insert
        var row = table.insertRow(++idx);
        var c0 = row.insertCell(0)
        var c1 = row.insertCell(1);
        var c2 = row.insertCell(2);
        var c3 = row.insertCell(3);
        var c4 = row.insertCell(4);
        updateIndex = idx;
    }

    var label = document.getElementById("formName").value;
    var value = document.getElementById("formValue").value !== ''
        ? document.getElementById("formValue").value
        : 0;
    var startDate = document.getElementById("formDate").value;
    var frequency = document.getElementById("formFrequency").value;
    var weekday = document.getElementById("formWeekday").value;
    var customDays = frequency === FREQUENCY_FORTNIGHTLY
        ? 14
        : document.getElementById("formCustomDays").value;
    var frequencyDescription = generateFrequency(frequency, new Date(startDate), weekday, customDays);

    c0.innerHTML = updateIndex;
    c1.innerHTML = label;
    c2.innerHTML = value;
    c3.innerHTML = frequencyDescription;
    c4.innerHTML = '<button type="button" class="btn btn-primary" onclick="modifyRow(' + updateIndex + ')"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>'
        + ' <button type="button" class="btn btn-danger" onclick="deleteRow(' + updateIndex + ')"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>';

    data[updateIndex] = {
        'label': label,
        'value': value,
        'startDate': startDate,
        'frequency': frequency,
        'weekday': weekday,
        'customDays': customDays,
    };
    resetForm();
    document.getElementById("transactionData").value = JSON.stringify(data);
    updateTable();
    // $(this).submit();
});

function modifyRow(i) {
    var table = document.getElementById("tableSettings");
    for (var r = 0, row; row = table.rows[r]; r++) {
        if (row.cells.item(0) !== null && row.cells.item(0).innerText == i) {

            var id = row.cells.item(0).innerText;
            document.getElementById("formId").value = id;
            document.getElementById("formName").value = data[id].label;
            document.getElementById("formValue").value = data[id].value;
            document.getElementById("formDate").value = data[id].startDate;
            document.getElementById("formFrequency").value = data[id].frequency;
            document.getElementById("formWeekday").value = data[id].weekday;
            document.getElementById("formCustomDays").value = data[id].customDays;
            formFrequencyTrigger(data[id].frequency);

            document.getElementById("addTransactionRowButton").innerHTML = 'Update';
            $('#btnAddTransaction').click();
            break;
        }
    }
}

function deleteRow(i) {
    delete data[i];
    var table = document.getElementById("tableSettings");
    for (var r = 0, row; row = table.rows[r]; r++) {
        if (row.cells.item(0) !== null && row.cells.item(0).innerText == i) {
            row.style.display = 'none';
            break;
        }
    }
    updateTable();
}

function updateTable() {
    var balance = 0;
    var settingsTable = document.getElementById("tableSettings");
    var projectTillDate = new Date(document.getElementById("projectTill").value);
    var resultsTable = document.getElementById("tableResult");

    resultsTable.innerHTML = '';
    var currentRow = resultsTable.insertRow();
    var transactionCount = settingsTable.rows.length;
    var today = new Date();
    var currentDate = new Date();

    var heading = '<th>Date</th>';
    var transactionData = JSON.parse(document.getElementById("transactionData").value);

    for (let [i, transaction] of Object.entries(transactionData)) {
        if (transaction['label']) {
            heading += '<th>' + transaction['label'] + '</th>';
        } else {
            heading += '<th>Transaction #' + i + '</th>';
        }
    }

    heading += '<th>BALANCE</th>';
    currentRow.innerHTML = heading;

    var xDayIndex = {};

    while (currentDate <= projectTillDate) {
        // First column is date
        var currentRow = resultsTable.insertRow();
        var cellDate = currentRow.insertCell();
        cellDate.innerHTML = getFullDate(currentDate);
        for (let [i, transaction] of Object.entries(transactionData)) {
            var startDate = new Date(transaction['startDate']);
            var cellNext = currentRow.insertCell();

            if ((transaction['frequency'] == FREQUENCY_FORTNIGHTLY
                || transaction['frequency'] == FREQUENCY_EVERY_X_DAYS)
                && currentDate > startDate
            ) {
                var isApply = false;
                if (!xDayIndex.hasOwnProperty(i)) {
                    xDayIndex[i] = Number(transaction['customDays']) - 1;
                }
                if (++xDayIndex[i] === Number(transaction['customDays'])) {
                    xDayIndex[i] = 0;
                    isApply = true;
                }
            } else {
                var isApply = checkTransactionAppliesToDate(
                    currentDate,
                    today,
                    startDate,
                    transaction['frequency'],
                    transaction['weekday'],
                    transaction['customDays']
                );
            }
            if (isApply) {
                cellNext.innerHTML = parseFloat(transaction['value']).toFixed(2);
                balance = Number(balance) + Number(transaction['value']);
            } else {
                cellNext.innerHTML = '-';
            }
        }

        // Last column is balance
        var cellBalance = currentRow.insertCell();
        cellBalance.innerHTML = parseFloat(balance).toFixed(2);

        // Increment Date
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

function checkTransactionAppliesToDate(currentDate, today, startDate, frequency, weekday, customDays) {
    switch (frequency) {
        case FREQUENCY_ONE_OFF:
            return getFullDate(currentDate) == getFullDate(startDate);
        case FREQUENCY_DAILY:
            return true;
        case FREQUENCY_WEEKLY:
            return weekday === WEEKDAYS[currentDate.getDay()];
        case FREQUENCY_MONTHLY:
        case FREQUENCY_YEARLY:
            var lastDateInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            var transactionDate = startDate.getDate();
            if (transactionDate > lastDateInMonth) {
                transactionDate = lastDateInMonth;
            }
            return currentDate.getDate() === transactionDate
                && (frequency === FREQUENCY_MONTHLY
                    || (currentDate.getFullYear() >= startDate.getFullYear()
                        && startDate.getMonth() == currentDate.getMonth())
                );
    }

    return false;
}

function resetForm() {
    document.getElementById("formId").value = '';
    document.getElementById("formName").value = '';
    document.getElementById("formValue").value = '';
    document.getElementById("formFrequency").value = 'One Off';
    document.getElementById("formDate").valueAsDate = new Date();
    document.getElementById("addTransactionRowButton").innerHTML = 'Add';
    formFrequencyTrigger('');
}

function formFrequencyTrigger(frequency) {
    var groupCustomDays = document.getElementById('formCustomDaysGroup');
    var groupWeek = document.getElementById('formWeekGroup');
    var groupCalendar = document.getElementById('formCalendarGroup');

    groupCustomDays.style.display = 'none';
    groupWeek.style.display = 'none';
    groupCalendar.style.display = 'none';

    if (typeof (frequency) === 'object') {
        frequency = frequency.value;
    }

    if (frequency === ''
        || frequency === FREQUENCY_ONE_OFF
        || frequency === FREQUENCY_FORTNIGHTLY
        || frequency === FREQUENCY_MONTHLY
        || frequency === FREQUENCY_YEARLY
    ) {
        groupCalendar.style.display = 'block';
    } else if (frequency === FREQUENCY_EVERY_X_DAYS) {
        groupCustomDays.style.display = 'block';
        groupCalendar.style.display = 'block';
    } else if (frequency === FREQUENCY_WEEKLY) {
        groupWeek.style.display = 'block';
    }
}

function generateFrequency(frequency, startDate, weekday, customDays) {
    switch (frequency) {
        case FREQUENCY_ONE_OFF:
            return 'An one off on ' + getFullDate(startDate);
        case FREQUENCY_DAILY:
            return 'Everyday';
        case FREQUENCY_WEEKLY:
            return 'Every ' + weekday;
        case FREQUENCY_FORTNIGHTLY:
            return 'Fortnightly, starting on ' + getFullDate(startDate)
        case FREQUENCY_MONTHLY:
            var extra = '';
            if (startDate.getDate() > 28) {
                extra = ' (or month end)';
            }
            return 'Monthly, on the ' + startDate.getDate() + getOrdinal(startDate.getDate()) + extra;
        case FREQUENCY_YEARLY:
            return 'Yearly starting on ' + getFullDate(startDate);
        case FREQUENCY_EVERY_X_DAYS:
            return 'Every ' + customDays + ' days';
    }
}

$('#formValue').on('input', function () {
    var currentValue = $('#formValue').val();
    if (!currentValue.match(/(^-?\d*\.?\d*$)/)) {
        $('#formValue').val('');
    }
});

function getFullDate(date) {
    return date.getDate()
        + getOrdinal(date.getDate())
        + ' ' + MONTHS[date.getMonth()]
        + ', ' + date.getFullYear();
}

function getOrdinal(date) {
    switch (date) {
        case 1:
        case 21:
        case 31:
            return 'st';
        case 2:
        case 22:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}
