const getFullBankingDetails = (eventData, groupData) => {
  if (!eventData || eventData.payment_type === "free") return [];

  let accountsMap = {}; // Use map to enforce uniqueness based on bank_acc_no

  // Helper to add an account to the map
  const addAccountToMap = (acc, isGroup = false) => {
    if (acc && acc.bank_acc_no) {
      const accNo = acc.bank_acc_no;
      if (!accountsMap[accNo]) {
        accountsMap[accNo] = {
          bank_acc_type: acc.bank_acc_type || "TBD",
          bank_acc_holder:
            acc.bank_acc_holder || (isGroup ? "Group Holder" : "Event Holder"),
          bank_acc_no: acc.bank_acc_no,
          bank_ifsc: acc.bank_ifsc || "N/A",
          is_group_account: isGroup,
        };
      }
    }
  };

  // 1. Add Group Primary Account (Highest priority)
  const groupAccount = groupData?.primary_bank_acc_no
    ? {
        bank_acc_type: groupData.primary_bank_acc_type,
        bank_acc_holder: groupData.primary_bank_acc_holder,
        bank_acc_no: groupData.primary_bank_acc_no,
        bank_ifsc: groupData.primary_bank_ifsc,
      }
    : null;
  addAccountToMap(groupAccount, true);

  // 2. Add Main Event Custom Accounts
  if (eventData.banking_details?.length > 0) {
    eventData.banking_details.forEach((acc) => addAccountToMap(acc, false));
  }

  // 3. Add Accounts from ALL Sub-Events (New Requirement)
  if (eventData.sub_events?.length > 0) {
    eventData.sub_events.forEach((subEvent) => {
      if (subEvent.banking_details?.length > 0) {
        // Assuming only the first banking detail from the subevent is relevant for display
        subEvent.banking_details.forEach((acc) => addAccountToMap(acc, false));
      }
    });
  }

  // Convert the unique map values back into an array for the carousel
  return Object.values(accountsMap);
};

export default getFullBankingDetails;
