let idx = 0;
let data = {};
let showEmptyRows = true;

const
    WEEKDAYS                = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
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

    let defaultDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    document.getElementById("projectTill").valueAsDate = defaultDate;
});
$('#projectTill').change(function () {
    updateTable()
});
$('#cancelTransactionRowButton').on('click', function (event) {
    resetForm();
});
$('#valueSignButton').on('click', function (event) {
    if (isValuePositive()) {
        setValueRed();
    } else {
        setValueGreen();
    }
});
function isValuePositive() {
    return $('#valueSignButton').hasClass('btn-success');
}
function setValueRed() {
    $('#valueSignButton').text("SUBTRACT")
        .removeClass('btn-success')
        .addClass('btn-danger');
    $('#formValue').removeClass('valueAdd')
        .addClass('valueSubtract');
}
function setValueGreen() {
    $('#valueSignButton').text("ADD")
        .removeClass('btn-danger')
        .addClass('btn-success');
    $('#formValue').removeClass('valueSubtract')
        .addClass('valueAdd');
}
$( "#exportModal" ).on('shown.bs.modal', function(){
    jsonExport();
});
$('#importJsonBtn').on('click', function (event) {
    jsonImport();
});
$('#addTransactionRowButton').on('click', function (event) {
    event.preventDefault();
    addRow();
    updateTable();
});
$('#btnToggleShowEmpty').on('click', function (event) {
    event.preventDefault();
    showEmptyRows = !showEmptyRows;
    updateTable();
});

function addRow() {
    let modifyId = document.getElementById("formId").value;
    let table = document.getElementById("tableSettings");
    let updateIndex = 0;
    let c0 = null;
    let c1 = null;
    let c2 = null;
    let c3 = null;
    let c4 = null;

    if (modifyId > 0) {
        // Modify
        updateIndex = modifyId;
        for (let r = 0, row; row = table.rows[r]; r++) {
            if (row.cells.item(4) !== null && row.cells.item(0).innerText == modifyId) {
                c0 = row.cells.item(0);
                c1 = row.cells.item(1);
                c2 = row.cells.item(2);
                c3 = row.cells.item(3);
                c4 = row.cells.item(4);
            }
        }
    } else {
        // Insert
        let row = table.insertRow(++idx);

        table.insertRow()

        c0 = row.insertCell(0)
        c1 = row.insertCell(1);
        c2 = row.insertCell(2);
        c3 = row.insertCell(3);
        c4 = row.insertCell(4);
        updateIndex = idx;
    }

    let label = document.getElementById("formName").value;
    let value = document.getElementById("formValue").value !== ''
        ? document.getElementById("formValue").value
        : 0;
    if (!isValuePositive()) {
        value *= -1;
    }
    let startDate = document.getElementById("formDate").value;
    let frequency = document.getElementById("formFrequency").value;
    let weekday = document.getElementById("formWeekday").value;
    let customDays = frequency === FREQUENCY_FORTNIGHTLY
        ? 14
        : document.getElementById("formCustomDays").value;
    let frequencyDescription = generateFrequency(frequency, new Date(startDate), weekday, customDays);

    c0.innerHTML = updateIndex;
    c1.innerHTML = label;
    let color = 'black';
    let prefix = '';
    if (value < 0) {
        color = 'red';
    } else if (value > 0) {
        color = 'green';
        prefix = '+';
    }
    c2.innerHTML = '<span style="color:' + color + '">' + prefix + value + '</span>';
    c3.innerHTML = frequencyDescription;
    c4.innerHTML = '<button type="button" class="btn btn-primary" onclick="modifyRow(' + updateIndex + ')"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>'
        + ' <button type="button" class="btn btn-danger" onclick="deleteRow(' + updateIndex + ', true)"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>';

    data[updateIndex] = {
        'label': label,
        'value': Number(value),
        'startDate': startDate,
        'frequency': frequency,
        'weekday': weekday,
        'customDays': customDays,
    };
    resetForm();
    document.getElementById("transactionData").value = JSON.stringify(data);
}

function modifyRow(i) {
    let table = document.getElementById("tableSettings");
    for (let r = 0, row; row = table.rows[r]; r++) {
        if (row.cells.item(0) !== null && row.cells.item(0).innerText == i) {
            let id = row.cells.item(0).innerText;
            document.getElementById("formId").value = id;
            document.getElementById("formName").value = data[id].label;
            let formValue = data[id].value;
            if (formValue < 0) {
                setValueRed();
                formValue *= -1;
            } else {
                setValueGreen();
            }
            document.getElementById("formValue").value = formValue;

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

function deleteRow(i, update) {
    delete data[i];
    let table = document.getElementById("tableSettings");
    for (let r = 0, row; row = table.rows[r]; r++) {
        if (row.cells.item(0) !== null && row.cells.item(0).innerText == i) {
            row.style.display = 'none';
            break;
        }
    }
    if (update) {
        document.getElementById("transactionData").value = JSON.stringify(data);
        updateTable();
    }
}

function getStartDate(transactionData)
{
    let startDate = null;
    for (let [i, transaction] of Object.entries(transactionData)) {
        let checkDate = new Date(transaction.startDate);
        if (startDate === null || checkDate < startDate) {
            startDate = checkDate;
        }
    }
    if (startDate === null) {
        startDate = new Date();
    }

    return startDate;
}

function updateTable() {
    let balance = 0;
    let projectTillDate = new Date(document.getElementById("projectTill").value);
    let resultsTable = document.getElementById("tableResult");
    resultsTable.innerHTML = '';
    var currentRow = resultsTable.insertRow();
    let heading = '<th></th><th></th>';
    heading += '<th colspan="3">Date</th>';
    let transactionData = JSON.parse(document.getElementById("transactionData").value);
    let today = new Date();
    let currentDate = getStartDate(transactionData);
    today.setHours(0, 0, 0, 0);
    currentDate.setHours(23, 59, 59, 0);

    for (let [i, transaction] of Object.entries(transactionData)) {
        let headerColor = transaction.value > 0 ? ' valueAdd' : 'valueSubtract';
        if (transaction['label']) {
            heading += '<th class="' + headerColor + '">' + transaction['label'] + '</th>';
        } else {
            heading += '<th class="' + headerColor + '">Transaction #' + i + '</th>';
        }
    }

    heading += '<th>BALANCE</th>';
    currentRow.innerHTML = heading;

    let xDayIndex = {};
    let counter = null;

    while (currentDate <= projectTillDate) {
        if (counter === null && currentDate >= today) {
            counter = 0;
        }

        let lastRow = currentDate.toDateString() == projectTillDate.toDateString();
        var currentRow = resultsTable.insertRow();
        //resultsTable.insertRow();

        // Set classes
        let rowStyle = (currentDate.getDay() == 6 || currentDate.getDay() == 0) ? 'weekend' : ''
        let monthYearStyle = '';
        let showIfFinal = ''
        if (lastRow) {
            showIfFinal = ' lastRow';
        }
        if (currentDate.getDate() == 1) {
            rowStyle += ' monthStart';
        } else {
            monthYearStyle = ' secondaryDates';
        }

        let rowWeekendStyle = rowStyle + " weekendBold";

        // Index
        if (counter !== null) {
            counter++;
        }
        let cellIndex = currentRow.insertCell();
        cellIndex.innerHTML = counter;
        cellIndex.className = rowStyle + " slimCol indexCol";

        // Dates
        let cellDateA = currentRow.insertCell();
        cellDateA.innerHTML = WEEKDAYS[currentDate.getDay()];
        cellDateA.className = rowWeekendStyle + " slimCol";
        let cellDateB = currentRow.insertCell();
        cellDateB.innerHTML = currentDate.getDate() + getOrdinal(currentDate.getDate());
        cellDateB.className = rowStyle + " slimCol";
        let cellDateC = currentRow.insertCell();
        cellDateC.innerHTML = MONTHS[currentDate.getMonth()];
        cellDateC.className = rowStyle + " slimCol" + monthYearStyle;
        let cellDateD = currentRow.insertCell();
        cellDateD.innerHTML = currentDate.getFullYear();
        cellDateD.className = rowStyle + " slimCol" + monthYearStyle;

        let hasEntry = false;
        for (let [i, transaction] of Object.entries(transactionData)) {
            let startDate = new Date(transaction['startDate']);
            let cellNext = currentRow.insertCell();
            cellNext.className = rowStyle;
            let isApply = null;
            if ((transaction['frequency'] == FREQUENCY_FORTNIGHTLY
                || transaction['frequency'] == FREQUENCY_EVERY_X_DAYS)
                && currentDate > startDate
            ) {
                isApply = false;
                if (!xDayIndex.hasOwnProperty(i)) {
                    xDayIndex[i] = Number(transaction['customDays']) - 1;
                }
                if (++xDayIndex[i] === Number(transaction['customDays'])) {
                    xDayIndex[i] = 0;
                    isApply = true;
                }
            } else {
                isApply = checkTransactionAppliesToDate(
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
                hasEntry = true;
            } else {
                cellNext.innerHTML = '-';
            }
        }

        // Last column is balance
        let balColour = balance > 0 ? ' positive' : ' negative';
        let cellBalance = currentRow.insertCell();
        cellBalance.innerHTML = parseFloat(balance).toFixed(2);
        cellBalance.className = rowStyle + " balanceCol" + balColour + showIfFinal;

        if ((!hasEntry && !lastRow && !showEmptyRows)
            || currentDate < today
        ) {
            currentRow.remove();
        }

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
            let lastDateInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            let transactionDate = startDate.getDate();
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
    setValueGreen();
    formFrequencyTrigger('');
}

function formFrequencyTrigger(frequency) {
    let groupCustomDays = document.getElementById('formCustomDaysGroup');
    let groupWeek = document.getElementById('formWeekGroup');
    let groupCalendar = document.getElementById('formCalendarGroup');

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
            return 'One off on ' + getFullDate(startDate);
        case FREQUENCY_DAILY:
            return 'Everyday';
        case FREQUENCY_WEEKLY:
            return 'Every ' + weekday;
        case FREQUENCY_FORTNIGHTLY:
            return 'Fortnightly, starting on ' + getFullDate(startDate)
        case FREQUENCY_MONTHLY:
            let extra = '';
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
    let currentValue = $('#formValue').val();
    if (!currentValue.match(/(^\d*\.?\d*$)/)) {
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

function jsonExport() {
    $('#exportJsonTextArea').val(JSON.stringify(data));
}

function jsonImport() {
    document.getElementById("tableResult").innerHTML = '';
    for (let i = 0; i < idx; i++) {
        deleteRow(i + 1, false);
    }
    idx = 0;

    data = JSON.parse($('#importJsonTextArea').val());
    for (let [i, row] of Object.entries(data)) {
        // document.getElementById("formId").value = i - 1;
        document.getElementById("formName").value = row['label'];
        document.getElementById("formValue").value = row['value'];
        document.getElementById("formFrequency").value = row['frequency'];
        document.getElementById("formDate").valueAsDate = new Date(row['startDate']);
        document.getElementById("formWeekday").value = row['weekday'];
        document.getElementById("formCustomDays").value = row['customDays'];
        addRow();
    }
    updateTable();
}