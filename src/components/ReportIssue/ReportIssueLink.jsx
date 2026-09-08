import PropTypes from 'prop-types';

/**
 * 「回報問題」入口
 * 目前依需求全站前台暫時隱藏此入口（直接回傳 null）。
 * 各頁面的 <ReportIssueLink /> 呼叫端無需更動，日後若需恢復可直接還原此元件。
 */
const ReportIssueLink = () => {
    return null;
};

ReportIssueLink.propTypes = {
    /** reportIssueConfig 的頁面代碼，如 'phrase'、'exam' */
    pageKey: PropTypes.string,
    label: PropTypes.string,
    detailOptions: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string,
};

export default ReportIssueLink;

