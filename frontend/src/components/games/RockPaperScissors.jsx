import { useState, useEffect } from 'react'
import { RotateCcw, Trophy } from 'lucide-react'
import { gamesAPI } from '../../api/games'

const CHOICES = [
  { id: 'rock', name: '바위', emoji: '✊' },
  { id: 'paper', name: '보', emoji: '✋' },
  { id: 'scissors', name: '가위', emoji: '✌️' },
]

const getResult = (playerChoice, computerChoice) => {
  if (playerChoice === computerChoice) return 'draw'
  
  const winConditions = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
  }
  
  return winConditions[playerChoice] === computerChoice ? 'win' : 'lose'
}

function RockPaperScissors() {
  const [playerChoice, setPlayerChoice] = useState(null)
  const [computerChoice, setComputerChoice] = useState(null)
  const [result, setResult] = useState(null)
  const [score, setScore] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
  })

  // 최고 기록 로드
  useEffect(() => {
    const loadBestScore = async () => {
      try {
        const result = await gamesAPI.getMyBestScore('ROCK_PAPER_SCISSORS')
        if (result.score && result.score.metadata) {
          setScore({
            wins: result.score.metadata.wins || 0,
            losses: result.score.metadata.losses || 0,
            draws: result.score.metadata.draws || 0,
          })
        }
      } catch (error) {
        console.error('최고 기록 로드 실패:', error)
      }
    }
    loadBestScore()
  }, [])

  const handleChoice = (choiceId) => {
    const computerChoiceId = CHOICES[Math.floor(Math.random() * CHOICES.length)].id
    const gameResult = getResult(choiceId, computerChoiceId)
    
    setPlayerChoice(choiceId)
    setComputerChoice(computerChoiceId)
    setResult(gameResult)
    
    setScore(prev => {
      const newScore = {
        wins: prev.wins + (gameResult === 'win' ? 1 : 0),
        losses: prev.losses + (gameResult === 'lose' ? 1 : 0),
        draws: prev.draws + (gameResult === 'draw' ? 1 : 0),
      }
      
      // 승률 계산 및 서버에 저장
      const total = newScore.wins + newScore.losses + newScore.draws
      if (total > 0) {
        const winRate = newScore.wins / total
        gamesAPI.saveScore('ROCK_PAPER_SCISSORS', winRate, {
          wins: newScore.wins,
          losses: newScore.losses,
          draws: newScore.draws,
          total,
        }).catch((error) => {
          console.error('점수 저장 실패:', error)
        })
      }
      
      return newScore
    })
  }

  const reset = () => {
    setPlayerChoice(null)
    setComputerChoice(null)
    setResult(null)
    setScore({ wins: 0, losses: 0, draws: 0 })
    // 리셋 시 서버에도 저장
    gamesAPI.saveScore('ROCK_PAPER_SCISSORS', 0, {
      wins: 0,
      losses: 0,
      draws: 0,
      total: 0,
    }).catch((error) => {
      console.error('점수 저장 실패:', error)
    })
  }

  const getResultMessage = () => {
    if (!result) return null
    
    switch (result) {
      case 'win':
        return { text: '승리! 🎉', color: 'text-green-600' }
      case 'lose':
        return { text: '패배 😢', color: 'text-red-600' }
      case 'draw':
        return { text: '무승부 🤝', color: 'text-gray-600' }
      default:
        return null
    }
  }

  const resultMsg = getResultMessage()

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6">가위바위보</h2>

      {/* 점수 표시 */}
      <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-md">
        <div className="bg-green-100 p-4 rounded text-center">
          <div className="text-sm text-green-700">승리</div>
          <div className="text-2xl font-bold text-green-800">{score.wins}</div>
        </div>
        <div className="bg-red-100 p-4 rounded text-center">
          <div className="text-sm text-red-700">패배</div>
          <div className="text-2xl font-bold text-red-800">{score.losses}</div>
        </div>
        <div className="bg-gray-100 p-4 rounded text-center">
          <div className="text-sm text-gray-700">무승부</div>
          <div className="text-2xl font-bold text-gray-800">{score.draws}</div>
        </div>
      </div>

      {/* 게임 결과 */}
      {playerChoice && computerChoice && (
        <div className="mb-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center flex-1">
              <div className="text-6xl mb-2">
                {CHOICES.find(c => c.id === playerChoice)?.emoji}
              </div>
              <div className="text-sm font-semibold">나</div>
            </div>
            <div className="text-2xl font-bold">VS</div>
            <div className="text-center flex-1">
              <div className="text-6xl mb-2">
                {CHOICES.find(c => c.id === computerChoice)?.emoji}
              </div>
              <div className="text-sm font-semibold">컴퓨터</div>
            </div>
          </div>
          {resultMsg && (
            <div className={`text-center text-2xl font-bold ${resultMsg.color} mb-4`}>
              {resultMsg.text}
            </div>
          )}
        </div>
      )}

      {/* 선택 버튼 */}
      <div className="flex gap-4 mb-6">
        {CHOICES.map(choice => (
          <button
            key={choice.id}
            onClick={() => handleChoice(choice.id)}
            className={`p-6 bg-white border-2 rounded-lg hover:bg-gray-50 transition-all ${
              playerChoice === choice.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300'
            }`}
          >
            <div className="text-5xl mb-2">{choice.emoji}</div>
            <div className="text-sm font-semibold">{choice.name}</div>
          </button>
        ))}
      </div>

      {/* 리셋 버튼 */}
      <button
        onClick={reset}
        className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        <RotateCcw className="w-4 h-4" />
        점수 리셋
      </button>

      <p className="text-sm text-gray-600 mt-4 text-center">
        가위, 바위, 보 중 하나를 선택하세요!
      </p>
    </div>
  )
}

export default RockPaperScissors

