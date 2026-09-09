import React from 'react';
import PropTypes from 'prop-types';
import contributorsData from './contributorsData';
import './ContributorCredits.css';

/**
 * 網站貢獻名單（TAIGIE-236）
 *
 * 呈現方式比照電影片尾的工作人員名單（Credits）：依貢獻類別分區，
 * 每區列出類別名稱與該類別的貢獻者姓名，姓名以「、」相連、不各自獨立成列。
 * 類別底下若還有 `subgroups`，就再分小段各給一個標題（目前只有「內容提供與授權」用到）。
 * 名單內容與排序規則見 `contributorsData.js`。
 */
const NameList = ({ people }) => (
  <p className="credits-names">
    {people.map(({ name }, index) => (
      <React.Fragment key={name}>
        {index > 0 && '、'}
        <span className="credits-name">{name}</span>
      </React.Fragment>
    ))}
  </p>
);

NameList.propTypes = {
  people: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string.isRequired })
  ).isRequired,
};

const ContributorCredits = () => (
  <section className="credits">
    <h2 className="credits-title">網站貢獻名單</h2>

    {contributorsData.map(({ category, people, subgroups }) => (
      <div className="credits-group" key={category}>
        <h3 className="credits-category">{category}</h3>

        {people && <NameList people={people} />}

        {subgroups?.map(subgroup => (
          <div className="credits-subgroup" key={subgroup.label}>
            <h4 className="credits-subcategory">{subgroup.label}</h4>
            <NameList people={subgroup.people} />
          </div>
        ))}
      </div>
    ))}
  </section>
);

export default ContributorCredits;
