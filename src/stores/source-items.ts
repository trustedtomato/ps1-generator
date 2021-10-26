export interface SourceItem {
  label: string
  result: string | ((...args: string[]) => string)
  example: string | ((...args: string[]) => string)
  type: string
}

export const sourceItems: SourceItem[] = [
  { label: 'Date in "Weekday Month Date" format (\\d)', result: '\\d', example: 'Tue May 26' },
  { label: 'Hostname up to the first "." (\\h)', result: '\\d', example: 'mycomputer' },
  { label: 'Hostname (\\H)', result: '\\H', example: 'mycomputer.localdomain' },
  { label: 'Number of jobs currently managed by the shell (\\j)', result: '\\j', example: '3' },
  { label: 'Basename of the shell\'s terminal device name (\\l)', result: '\\l', example: '0' },
  { label: 'Name of the shell (\\s)', result: '\\s', example: 'bash' },
  { label: 'Time in 24-hour HH:MM:SS format (\\t)', result: '\\t', example: '22:46:03' },
  { label: 'Time in 12-hour HH:MM:SS format (\\T)', result: '\\T', example: '10:46:03' },
  { label: 'Time in 12-hour am/pm format (\\@)', result: '\\@', example: '10:46 PM' },
  { label: 'Time in 24-hour HH:MM format (\\A)', result: '\\A', example: '22:46' },
  { label: 'Username of the current user (\\u)', result: '\\u', example: 'potatocaptain' },
  { label: 'Version of Bash (\\v)', result: '\\v', example: '5.1' },
  { label: 'Version of Bash + patchlevel (\\V)', result: '\\V', example: '5.1.8' },
  { label: 'Current working directory (\\w)', result: '\\w', example: '~/Documents/mydir' },
  { label: 'Current working directory\'s basename (\\W)', result: '\\W', example: 'mydir' },
  { label: 'History number of this command (\\!)', result: '\\W', example: '127' },
  { label: 'Command number of this command (\\#)', result: '\\#', example: '26' },
  { label: '# if the effective UID is 0, otherwise $', result: '\\$', example: '$' },
  { label: 'Text', result: (text: string) => text.replace(/\\/g, '\\\\'), example: (text: string) => text}
].map((source, index) => ({
  ...source,
  type: String(index)
}))