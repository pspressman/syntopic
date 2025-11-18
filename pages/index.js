import Link from 'next/link'
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Grammar & Reading Comprehension Game</title>
        <meta name="description" content="4-stage grammar and reading comprehension game" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{
            fontSize: '36px',
            color: '#667eea',
            marginBottom: '20px'
          }}>
            🧪 Grammar & Reading Game 🌍
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: '#666',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Learn about rocks and grammar through 4 fun stages!
          </p>
          
          <Link 
            href="/grammar-game"
            style={{
              display: 'inline-block',
              padding: '15px 40px',
              fontSize: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '50px',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
          >
            Start Playing! 🎮
          </Link>
        </div>
      </div>
    </>
  )
}
