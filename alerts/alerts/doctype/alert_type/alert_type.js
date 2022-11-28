/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert Type', {
    onload: function(frm) {
        frm.A = {
            _mock: null,
            mock: function() {
                if (frm.A._mock) return;
                frm.A._mock = Alerts.mock(frm.get_field('mock_html').$wrapper);
                if (!frm.is_new()) frm.A.refresh();
            },
            refresh: function() {
                frm.A._mock && frm.A._mock.css(frm.doc);
            }
        };
    },
    refresh: function(frm) {
        frm.A.mock();
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