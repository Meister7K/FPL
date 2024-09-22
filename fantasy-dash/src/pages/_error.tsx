// @ts-nocheck
import Link from "next/link"

function Error({ statusCode }) {
    return (<>
    <p>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
      <Link href={'/test'}>Return</Link>
    </>
      
    )
  }
   
  Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404
    return { statusCode }
  }
   
  export default Error