import { action } from '@uibakery/data';

function updateDealSortOrder() {
  return action('updateDealSortOrder', 'SQL', {
    databaseName: 'crm_contacts_db_2',
    query: `
      UPDATE deals
      SET
        sort_order = {{params.sortOrder}}::integer,
        updated_at = NOW()
      WHERE id = {{params.dealId}}::bigint;
    `,
  });
}

export default updateDealSortOrder;