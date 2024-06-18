/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.query_reports['Alert Report'] = {
    filters: [
        {
            'fieldname': 'alert_type',
            'label': __('Alert Type'),
            'fieldtype': 'Link',
            'options': 'Alert Type'
        },
        {
            'fieldname': 'from_date',
            'label': __('From Date'),
            'fieldtype': 'Date'
        },
        {
            'fieldname': 'until_date',
            'label': __('Until Date'),
            'fieldtype': 'Date'
        },
        {
            'fieldtype': 'Break',
        },
        {
            'fieldname': 'is_repeatable',
            'label': __('Repeatable'),
            'fieldtype': 'Check'
        },
        {
            'fieldname': 'status',
            'label': __('Status'),
            'fieldtype': 'Select',
            'options': '\nDraft\nPending\nActive\nFinished\nCancelled'
        },
    ]
};