/**
 * @typedef {'Fellowship' | 'Scholarship' | 'Bootcamp' | 'Internship' | 'Hackathon'} Category
 *
 * @typedef {'saved' | 'in_progress' | 'applied' | 'submitted'} Status
 *
 * @typedef {Object} EligibilityItem
 * @property {string} label
 * @property {boolean} met
 *
 * @typedef {Object} Opportunity
 * @property {string} id
 * @property {string} title
 * @property {string} org
 * @property {Category} category
 * @property {string} deadline
 * @property {string} location
 * @property {number} match
 * @property {string} summary
 * @property {string} description
 * @property {EligibilityItem[]} eligibility
 * @property {string[]} benefits
 * @property {string} url
 *
 * @typedef {Object} Profile
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} country
 * @property {string} city
 * @property {string} stage
 * @property {string} level
 * @property {string} [linkedin]
 * @property {string} [portfolio]
 * @property {string} [github]
 * @property {string[]} interests
 * @property {string[]} preferences
 *
 * @typedef {Object} Application
 * @property {string} opportunityId
 * @property {Status} status
 * @property {Record<string, boolean>} checklist
 * @property {string} [submittedOn]
 */

export {};
