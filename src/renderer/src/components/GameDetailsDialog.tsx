import React, { useState, useEffect, useCallback, useRef } from 'react'
import { GameInfo } from '@shared/types'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  Button,
  DialogContent,
  tokens,
  shorthands,
  makeStyles,
  Text,
  Image,
  Badge,
  Divider,
  Spinner,
  ProgressBar
} from '@fluentui/react-components'
import {
  ArrowClockwiseRegular,
  DismissRegular,
  DocumentDataRegular,
  CalendarClockRegular,
  ArrowDownloadRegular as DownloadIcon,
  TagRegular,
  DeleteRegular,
  ArrowSyncRegular,
  ArrowUpRegular,
  InfoRegular,
  CheckmarkCircleRegular,
  VideoRegular,
  OpenRegular,
  BroomRegular as UninstallIcon
} from '@fluentui/react-icons'
import placeholderImage from '../assets/images/game-placeholder.png'
import { useGames } from '@renderer/hooks/useGames'

const useStyles = makeStyles({
  dialogContentLayout: {
    display: 'grid',
    gridTemplateColumns: '150px 1fr',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start'
  },
  detailsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  badgesAndInfoContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    marginTop: tokens.spacingVerticalS,
    flexWrap: 'wrap'
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center'
  },
  inlineInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  detailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  noteSection: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM
  },
  noteTitle: {
    marginBottom: tokens.spacingVerticalS,
    display: 'block'
  },
  noteContent: {
    whiteSpace: 'pre-wrap',
    maxHeight: '150px',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  deleteConfirmText: {
    ...shorthands.padding(tokens.spacingVerticalM, 0)
  },
  installingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  dismissButton: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalXS),
    minWidth: 'unset'
  },
  trailerSection: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM
  },
  youtubeContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%', // 16:9 aspect ratio
    marginTop: tokens.spacingVerticalM,
    overflow: 'hidden',
    borderRadius: tokens.borderRadiusMedium
  },
  youtubePlayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none'
  },
  trailerTitle: {
    marginBottom: tokens.spacingVerticalS,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  progressSection: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM
  }
})

interface GameDetailsDialogProps {
  game: GameInfo | null
  open: boolean
  onClose: () => void
  downloadStatusMap: Map<string, { status: string; progress: number }>
  onInstall: (game: GameInfo) => void
  onUninstall: (game: GameInfo) => Promise<void>
  onReinstall: (game: GameInfo) => Promise<void>
  onUpdate: (game: GameInfo) => Promise<void>
  onRetry: (game: GameInfo) => void
  onCancelDownload: (game: GameInfo) => void
  onDeleteDownloaded: (game: GameInfo) => void
  onInstallFromCompleted: (game: GameInfo) => void
  getNote: (releaseName: string) => Promise<string | null>
  isConnected: boolean
  isBusy: boolean
}

const GameDetailsDialog: React.FC<GameDetailsDialogProps> = ({
  game,
  open,
  onClose,
  downloadStatusMap,
  onInstall,
  onUninstall,
  onReinstall,
  onUpdate,
  onRetry,
  onCancelDownload,
  onDeleteDownloaded,
  onInstallFromCompleted,
  getNote,
  isConnected,
  isBusy
}) => {
  const styles = useStyles()
  const { getTrailerVideoId: getTrailerVideoIdFromContext } = useGames()
  const [currentGameNote, setCurrentGameNote] = useState<string | null>(null)
  const [loadingNote, setLoadingNote] = useState<boolean>(false)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [loadingVideo, setLoadingVideo] = useState<boolean>(false)
  const webviewRef = useRef<HTMLElement>(null)

  // Inject CSS into the YouTube webview to hide non-player UI elements
  const handleWebviewReady = useCallback(() => {
    const wv = webviewRef.current as HTMLElement & {
      insertCSS: (css: string) => Promise<string>
      executeJavaScript: (code: string) => Promise<unknown>
    }
    if (!wv) return
    // Hide everything except the video player
    wv.insertCSS(`
      #masthead-container, #top-row, #bottom-row,
      ytd-watch-metadata, #related, #comments,
      #secondary, #below, ytd-masthead,
      #guide-button, ytd-mini-guide-renderer,
      #chat-container, .ytp-chrome-top,
      #info-contents, #meta-contents,
      ytd-merch-shelf-renderer, #offer-module,
      tp-yt-app-drawer, #guide-wrapper,
      .ytd-watch-flexy #menu, #subscribe-button,
      .ytd-watch-flexy #actions, #notification-preference-button,
      ytd-watch-next-secondary-results-renderer,
      #description, #header, #content-header,
      ytd-engagement-panel-section-list-renderer,
      #panels, ytd-watch-flexy #cinematics,
      ytd-compact-video-renderer, .ytp-endscreen-content,
      .ytp-ce-element, .ytp-pause-overlay,
      ytd-clarification-renderer, ytd-info-panel-content-renderer {
        display: none !important;
      }
      body { overflow: hidden !important; background: #000 !important; }
      #page-manager, ytd-watch-flexy, #player-container-outer,
      #player-container-inner, #player, #ytd-player,
      .html5-video-player, video {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        width: 100vw !important; height: 100vh !important;
        max-width: 100vw !important; max-height: 100vh !important;
        margin: 0 !important; padding: 0 !important;
      }
      ytd-watch-flexy[theater], ytd-watch-flexy[fullscreen] {
        max-height: 100vh !important;
      }
      .html5-video-container { width: 100% !important; height: 100% !important; }
    `)
    // Auto-click the play button if paused
    wv.executeJavaScript(`
      const v = document.querySelector('video');
      if (v && v.paused) v.play();
    `)
  }, [])

  // Attach dom-ready listener when webview mounts
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv || !videoId) return
    wv.addEventListener('dom-ready', handleWebviewReady)
    return () => wv.removeEventListener('dom-ready', handleWebviewReady)
  }, [videoId, handleWebviewReady])

  // Fetch note when dialog opens or game changes
  useEffect(() => {
    let isMounted = true

    if (open && game && game.releaseName) {
      const fetchNote = async (): Promise<void> => {
        setLoadingNote(true)
        setCurrentGameNote(null)
        try {
          const note = await getNote(game.releaseName)
          if (isMounted) {
            setCurrentGameNote(note)
          }
        } catch (err) {
          console.error(`Error fetching note for ${game.releaseName}:`, err)
          if (isMounted) {
            setCurrentGameNote('Error loading note.')
          }
        } finally {
          if (isMounted) {
            setLoadingNote(false)
          }
        }
      }
      fetchNote()
    }

    return () => {
      isMounted = false
    }
  }, [open, game, getNote])

  useEffect(() => {
    let isMounted = true

    const getTrailerVideoId = async (): Promise<void> => {
      if (!game?.name) return

      setLoadingVideo(true)
      setVideoId(null)

      try {
        const videoId = await getTrailerVideoIdFromContext(game.name)

        if (isMounted && videoId) {
          setVideoId(videoId)
        }
      } catch (error) {
        console.error('Error searching for game trailer:', error)
      } finally {
        if (isMounted) {
          setLoadingVideo(false)
        }
      }
    }

    if (open && game?.name) {
      getTrailerVideoId()
    }

    return () => {
      isMounted = false
    }
  }, [open, game, getTrailerVideoIdFromContext])

  // Helper function to render action buttons based on game state
  const renderActionButtons = (currentGame: GameInfo): React.ReactNode => {
    const status = downloadStatusMap.get(currentGame.releaseName || '')?.status
    const canCancel = status === 'Downloading' || status === 'Extracting' || status === 'Queued'
    const isDownloaded = status === 'Completed'
    const isInstalled = currentGame.isInstalled
    const hasUpdate = currentGame.hasUpdate
    const isInstallError = status === 'InstallError'
    const isErrorOrCancelled = status === 'Error' || status === 'Cancelled'
    const isInstalling = status === 'Installing'

    if (isInstalling) {
      return (
        <div className={styles.installingIndicator}>
          <Spinner size="small" />
          <Text>Installing...</Text>
        </div>
      )
    }

    if (canCancel) {
      return (
        <Button
          appearance="danger"
          icon={<DismissRegular />}
          onClick={() => onCancelDownload(currentGame)}
          disabled={isBusy}
        >
          Cancel Download
        </Button>
      )
    }

    if (isInstallError || isErrorOrCancelled) {
      return (
        <>
          <Button
            appearance="primary"
            icon={<ArrowClockwiseRegular />}
            onClick={() => onRetry(currentGame)}
            disabled={isBusy}
          >
            Retry
          </Button>
          <Button
            appearance="danger"
            icon={<DeleteRegular />}
            onClick={() => onDeleteDownloaded(currentGame)}
            disabled={isBusy}
          >
            Delete Downloaded Files
          </Button>
        </>
      )
    }

    if (isInstalled) {
      if (hasUpdate) {
        return (
          <>
            <Button
              appearance="primary"
              icon={<ArrowUpRegular />}
              onClick={() => onUpdate(currentGame)}
              disabled={!isConnected || isBusy}
            >
              Update
            </Button>
            <Button
              appearance="danger"
              icon={<UninstallIcon />}
              onClick={() => onUninstall(currentGame)}
              disabled={!isConnected || isBusy}
            >
              Uninstall
            </Button>
          </>
        )
      } else {
        return (
          <>
            <Button
              appearance="secondary"
              icon={<ArrowSyncRegular />}
              onClick={() => onReinstall(currentGame)}
              disabled={!isConnected || isBusy}
            >
              Reinstall
            </Button>
            <Button
              appearance="danger"
              icon={<UninstallIcon />}
              onClick={() => onUninstall(currentGame)}
              disabled={!isConnected || isBusy}
            >
              Uninstall
            </Button>
          </>
        )
      }
    }

    if (isDownloaded) {
      return (
        <>
          <Button
            appearance="primary"
            icon={<CheckmarkCircleRegular />}
            onClick={() => onInstallFromCompleted(currentGame)}
            disabled={!isConnected || isBusy}
          >
            Install
          </Button>
          <Button
            appearance="danger"
            icon={<DeleteRegular />}
            onClick={() => onDeleteDownloaded(currentGame)}
            disabled={isBusy}
          >
            Delete Downloaded Files
          </Button>
        </>
      )
    }

    return (
      <Button
        appearance="primary"
        icon={<DownloadIcon />}
        onClick={() => onInstall(currentGame)}
        disabled={isBusy}
      >
        {isConnected ? 'Install' : 'Download'}
      </Button>
    )
  }

  const handleClose = (): void => {
    onClose()
  }

  if (!game) return null

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(_e, data) => !data.open && handleClose()}
        modalType="modal"
      >
        <DialogSurface mountNode={document.getElementById('portal')}>
          <DialogBody>
            <div className={styles.dialogHeader}>
              <DialogTitle>{game?.name}</DialogTitle>
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={handleClose}
                className={styles.dismissButton}
                aria-label="Close"
              />
            </div>
            <DialogContent>
              <div className={styles.dialogContentLayout}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}
                >
                  <Image
                    src={game.thumbnailPath ? `file://${game.thumbnailPath}` : placeholderImage}
                    alt={`${game.name} thumbnail`}
                    shape="rounded"
                    width={150}
                    height={150}
                    fit="cover"
                    style={{
                      height: '150px',
                      width: '150px'
                    }}
                  />
                </div>
                <div className={styles.detailsColumn}>
                  <div className={styles.infoSection}>
                    <Text size={600} weight="semibold">
                      {game.name}
                    </Text>
                    <Text
                      size={300}
                      weight="regular"
                      style={{ color: tokens.colorNeutralForeground2 }}
                    >
                      {game.packageName}
                    </Text>
                    <div className={styles.badgesAndInfoContainer}>
                      <div className={styles.badgeGroup}>
                        <Badge
                          shape="rounded"
                          color={(() => {
                            const status = downloadStatusMap.get(game.releaseName || '')?.status
                            if (game.isInstalled) return 'success'
                            if (status === 'Completed') return 'brand'
                            if (status === 'InstallError') return 'danger'
                            if (status === 'Installing') return 'brand'
                            return 'informative'
                          })()}
                          appearance="filled"
                        >
                          {(() => {
                            const status = downloadStatusMap.get(game.releaseName || '')?.status
                            if (game.isInstalled) return 'Installed'
                            if (status === 'Completed') return 'Downloaded'
                            if (status === 'InstallError') return 'Install Error'
                            if (status === 'Installing') return 'Installing'
                            return 'Not Installed'
                          })()}
                        </Badge>
                        {game.hasUpdate && (
                          <Badge shape="rounded" color="brand" appearance="filled">
                            Update Available
                          </Badge>
                        )}
                      </div>
                      <div className={styles.inlineInfo}>
                        <DocumentDataRegular fontSize={16} />
                        <Text size={300}>{game.size || '-'}</Text>
                      </div>
                      <div className={styles.inlineInfo}>
                        <DownloadIcon fontSize={16} />
                        <Text size={300}>{game.downloads?.toLocaleString() || '-'}</Text>
                      </div>
                      <div className={styles.inlineInfo}>
                        <InfoRegular fontSize={16} />
                        <Text size={300}>
                          {game.version ? `v${game.version}` : '-'}
                          <span
                            style={{
                              color: tokens.colorNeutralForeground3,
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}
                          >
                            {game.isInstalled &&
                              game.deviceVersionCode &&
                              ` (Device: v${game.deviceVersionCode})`}
                          </span>
                        </Text>
                      </div>
                    </div>
                  </div>
                  <Divider />
                  <div className={styles.detailList}>
                    <div className={styles.inlineInfo}>
                      <TagRegular fontSize={16} />
                      <Text>{game.releaseName || '-'}</Text>
                    </div>
                    <div className={styles.inlineInfo}>
                      <CalendarClockRegular fontSize={16} />
                      <Text>{game.lastUpdated || '-'}</Text>
                    </div>
                  </div>
                </div>
              </div>
              <Divider style={{ marginTop: tokens.spacingVerticalS }} />
              <div className={styles.noteSection}>
                <Text weight="semibold" className={styles.noteTitle}>
                  Note:
                </Text>
                {loadingNote ? (
                  <Spinner size="tiny" label="Loading note..." />
                ) : currentGameNote ? (
                  <div className={styles.noteContent}>{currentGameNote}</div>
                ) : (
                  <Text>No note available.</Text>
                )}
              </div>

              <div className={styles.trailerSection}>
                <div className={styles.trailerTitle}>
                  <VideoRegular fontSize={16} />
                  <Text weight="semibold">Trailer:</Text>
                  {videoId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacingHorizontalXS,
                        fontSize: 12,
                        color: tokens.colorBrandForeground1,
                        textDecoration: 'none'
                      }}
                    >
                      <OpenRegular fontSize={12} />
                      Watch on YouTube
                    </a>
                  )}
                </div>
                {loadingVideo ? (
                  <Spinner size="tiny" label="Searching for trailer..." />
                ) : videoId ? (
                  <div className={styles.youtubeContainer}>
                    <webview
                      ref={webviewRef}
                      className={styles.youtubePlayer}
                      src={`https://www.youtube.com/watch?v=${videoId}`}
                      partition="persist:youtube"
                      allowpopups="true"
                      title="Game Trailer"
                    />
                  </div>
                ) : (
                  <Text>No trailer available.</Text>
                )}
              </div>

              {/* Download Progress Section */}
              {game.releaseName && downloadStatusMap.get(game.releaseName) && (
                <div className={styles.progressSection}>
                  {(() => {
                    const status = downloadStatusMap.get(game.releaseName || '')?.status
                    const progress = downloadStatusMap.get(game.releaseName || '')?.progress || 0
                    const isDownloading = status === 'Downloading'
                    const isExtracting = status === 'Extracting'
                    const isInstalling = status === 'Installing'

                    if (isDownloading || isExtracting || isInstalling) {
                      return (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: tokens.spacingHorizontalS,
                              marginBottom: tokens.spacingVerticalS
                            }}
                          >
                            <Spinner size="tiny" />
                            <Text weight="semibold">
                              {status}... {progress}%
                            </Text>
                          </div>
                          <ProgressBar
                            value={progress}
                            max={100}
                            shape="rounded"
                            thickness="medium"
                            aria-label={`${status} progress`}
                          />
                        </>
                      )
                    }
                    return null
                  })()}
                </div>
              )}

              <div className={styles.actionsList}>{renderActionButtons(game)}</div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  )
}

export default GameDetailsDialog
