import { User } from '../../types';

interface UserInfoProps {
  userData: User;
}

const UserInfo = ({ userData }: UserInfoProps) => {

  console.log(userData)
  return (
    <div className='flex flex-col mx-auto w-full items-center p-10 border border-slate-200 rounded-md '>
      <h2 className="text-xl font-bold mb-4">User Information</h2>
      <img className='rounded-full w-36 h-auto border border-slate-200' src={`https://sleepercdn.com/avatars/${userData.avatar}`}  />
      <p>Display Name: {userData.display_name}</p>
      
      {/* Add more user data as needed */}
    </div>
  );
};

export default UserInfo;