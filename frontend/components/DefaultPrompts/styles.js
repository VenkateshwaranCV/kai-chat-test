const styles = {
  defaultPromptsSingleCardProps: {
    height: '100%',
    width: '80%',
    borderRadius: '20px',
    border: '5px solid rgb(141, 126, 235)',
    backgroundColor: 'white',
    transition: 'box-shadow .3s', // added for Smouth transition
    boxShadow: '1px 3px 1px white',
  },
  defaultPromptsContainerProps: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPromptsProps: {
    display: 'flex',
    flexDirection: 'row',
    containter: true,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '20%',
    width: '95%',
  },
  hoverCard: {
    height: '100%',
    width: '80%',
    borderRadius: '20px',
    border: '5px solid rgb(141, 126, 235)',
    backgroundColor: 'white',
    transition: 'box-shadow .3s', // added for Smouth transition
    boxShadow: '1px 3px 1px #9E9E9E',
  },
};
export default styles;
