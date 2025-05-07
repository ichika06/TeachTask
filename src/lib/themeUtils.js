export const getPriorityColors = (priority, theme = 'light') => {
  const isDark = theme === 'dark';
  
  const cardColors = {
    light: {
      high: 'bg-red-100 border-red-200',
      medium: 'bg-yellow-100 border-yellow-200',
      low: 'bg-green-100 border-green-200',
      default: 'bg-gray-100 border-gray-200'
    },
    dark: {
      high: 'bg-red-900/20 border-red-800/30',
      medium: 'bg-yellow-900/20 border-yellow-800/30',
      low: 'bg-green-900/20 border-green-800/30',
      default: 'bg-gray-800/20 border-gray-700/30'
    }
  };

  const numberColors = {
    light: {
      high: 'bg-red-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-green-500 text-white',
      default: 'bg-gray-500 text-white'
    },
    dark: {
      high: 'bg-red-600 text-white',
      medium: 'bg-yellow-600 text-white',
      low: 'bg-green-600 text-white',
      default: 'bg-gray-600 text-white'
    }
  };

  const textColors = {
    light: {
      primary: 'text-gray-800',
      secondary: 'text-gray-500',
      accent: 'text-blue-600',
      done: 'text-gray-400'
    },
    dark: {
      primary: 'text-gray-100',
      secondary: 'text-gray-400',
      accent: 'text-blue-400',
      done: 'text-gray-500'
    }
  };

  const badgeColors = {
    light: {
      task: 'bg-blue-100 text-blue-800',
      todo: 'bg-purple-100 text-purple-800'
    },
    dark: {
      task: 'bg-blue-900/30 text-blue-300',
      todo: 'bg-purple-900/30 text-purple-300'
    }
  };

  return {
    card: cardColors[isDark ? 'dark' : 'light'][priority] || cardColors[isDark ? 'dark' : 'light'].default,
    number: numberColors[isDark ? 'dark' : 'light'][priority] || numberColors[isDark ? 'dark' : 'light'].default,
    text: textColors[isDark ? 'dark' : 'light'],
    badge: badgeColors[isDark ? 'dark' : 'light']
  };
}; 