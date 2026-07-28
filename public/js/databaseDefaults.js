/* ── DataTables shared config ── */
const dtDefaults = {
    language: {
        search: '',
        searchPlaceholder: ' Tìm kiếm...',
        lengthMenu: 'Hiển thị _MENU_ dòng',
        info: 'Hiển thị _START_–_END_ / _TOTAL_ bản ghi',
        infoEmpty: 'Không có bản ghi',
        infoFiltered: '(lọc từ _MAX_ bản ghi)',
        zeroRecords: 'Không tìm thấy kết quả phù hợp',
        emptyTable: 'Không có dữ liệu',
        paginate: {
            first: '«',
            previous: '‹',
            next: '›',
            last: '»'
        }
    },
    dom:
        '<"dataTables_top-bar"lf>' +
        'rt' +
        '<"dataTables_bottom-bar"ip>',
    pageLength: 5,
    lengthMenu: [5, 10, 25, 50],
    responsive: true,
    autoWidth: false,
    stateSave: false,
    drawCallback: function () {
        // Re-apply badge HTML after each draw (DataTables doesn't escape HTML by default)
    }
};

/* Init dashboard table */
const dtDashboard = $('#tbl-dashboard').DataTable($.extend(true, {}, dtDefaults, {
    order: [[3, 'desc']],          // sort by date desc
    columnDefs: [
        { orderable: false, targets: [1, 4] }   // badge columns not sortable
    ]
}));

/* Re-init DataTables when switching to a tab that was hidden
   (DataTables can miscalculate column widths on hidden tabs) */
$(document).on('click', '.nav-item, .mob-nav-item', function () {
    setTimeout(function () {
        $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();
    }, 50);
});