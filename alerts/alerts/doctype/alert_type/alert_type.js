/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert Type', {
    onload: function(frm) {
        frm.A = {
            has_mock: 0,
            mock: function() {
                frm.A.has_mock = 1;
                Alerts.mock(frm.get_field('mock_html').$wrapper);
                if (!frm.is_new()) frm.A.refresh();
            },
            refresh: function() {
                Alerts.setType(frm.doc, 1);
            }
        };
    },
    refresh: function(frm) {
        if (!frm.A.has_mock) frm.A.mock();
    },
    background: function(frm) {
        if (frm.doc.background) frm.A.refresh();
    },
    border_color: function(frm) {
        if (frm.doc.border_color) frm.A.refresh();
    },
    title_color: function(frm) {
        if (frm.doc.title_color) frm.A.refresh();
    },
    content_color: function(frm) {
        if (frm.doc.content_color) frm.A.refresh();
    },
});