import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { ImportingModel, fs } from '@janhq/core'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@janhq/uikit'
import { useAtomValue, useSetAtom } from 'jotai'

import { UploadCloudIcon } from 'lucide-react'

import { v4 as uuidv4 } from 'uuid'

import {
  getImportModelStageAtom,
  setImportModelStageAtom,
} from '@/hooks/useImportModel'

import {
  FilePathWithSize,
  getFileInfoFromFile,
  getFileNameFromPath,
} from '@/utils/file'

import { importingModelsAtom } from '@/helpers/atoms/Model.atom'

const SelectingModelModal: React.FC = () => {
  const setImportModelStage = useSetAtom(setImportModelStageAtom)
  const importModelStage = useAtomValue(getImportModelStageAtom)
  const setImportingModels = useSetAtom(importingModelsAtom)

  const onSelectFileClick = useCallback(async () => {
    const filePaths = await window.core?.api?.selectModelFiles()
    if (!filePaths || filePaths.length === 0) return

    const sanitizedFilePaths: FilePathWithSize[] = []
    for (const filePath of filePaths) {
      const fileStats = await fs.fileStat(filePath, true)
      if (!fileStats || fileStats.isDirectory) continue

      const fileName = getFileNameFromPath(filePath)
      sanitizedFilePaths.push({
        path: filePath,
        name: fileName,
        size: fileStats.size,
      })
    }

    const importingModels: ImportingModel[] = sanitizedFilePaths.map(
      ({ path, name, size }: FilePathWithSize) => {
        return {
          importId: uuidv4(),
          modelId: undefined,
          name: name,
          description: '',
          path: path,
          tags: [],
          size: size,
          status: 'PREPARING',
          format: 'gguf',
        }
      }
    )
    if (importingModels.length === 0) return

    setImportingModels(importingModels)
    setImportModelStage('MODEL_SELECTED')
  }, [setImportingModels, setImportModelStage])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const filePathWithSize = getFileInfoFromFile(acceptedFiles)

      const importingModels: ImportingModel[] = filePathWithSize.map(
        (file) => ({
          importId: uuidv4(),
          modelId: undefined,
          name: file.name,
          description: '',
          path: file.path,
          tags: [],
          size: file.size,
          status: 'PREPARING',
          format: 'gguf',
        })
      )
      if (importingModels.length === 0) return

      setImportingModels(importingModels)
      setImportModelStage('MODEL_SELECTED')
    },
    [setImportModelStage, setImportingModels]
  )

  const { isDragActive, getRootProps } = useDropzone({
    noClick: true,
    multiple: true,
    onDrop,
  })

  const borderColor = isDragActive ? 'border-primary' : 'border-[#F4F4F5]'
  const textColor = isDragActive ? 'text-primary' : 'text-[#71717A]'
  const dragAndDropBgColor = isDragActive ? 'bg-[#EFF6FF]' : 'bg-white'

  return (
    <Modal
      open={importModelStage === 'SELECTING_MODEL'}
      onOpenChange={() => {
        setImportModelStage('NONE')
      }}
    >
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Import Model</ModalTitle>

          <p className="text-sm font-medium text-[#71717A]">
            Import any model file (GGUF) or folder. Your imported model will be
            private to you.
          </p>
        </ModalHeader>

        <div
          className={`flex h-[172px] w-full items-center justify-center rounded-md border ${borderColor} ${dragAndDropBgColor}`}
          {...getRootProps()}
          onClick={onSelectFileClick}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-200">
              <UploadCloudIcon size={24} className="text-blue-600" />
            </div>

            <div className="mt-4">
              <span className="text-sm font-bold text-primary">
                Click to upload
              </span>
              <span className={`text-sm ${textColor} font-medium`}>
                {' '}
                or drag and drop
              </span>
            </div>
            <span className={`text-xs font-medium ${textColor}`}>(GGUF)</span>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

export default SelectingModelModal