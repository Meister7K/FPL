
const getDisplayName = (ownerId: string, fplDB: any[]) => {
    const user = fplDB.find(user => user.user_id === ownerId);
    return user ? user.display_name : `Team ${ownerId}`;
  };