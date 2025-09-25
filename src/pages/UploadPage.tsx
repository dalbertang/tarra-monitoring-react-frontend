import React, { useState, useCallback } from 'react';
import styles from './UploadPage.module.css';
import { useAuthenticatedApi, uploadVibrationData, generateVibrationReport } from '../utils/api';

const imgLogo = "/4b4aedecf99ecb266fd2abeba49c331e9a81bb88.png";
const imgMenu = "/199ecae9310161189029287df6316fcbc6d2ebbf.svg";
const imgDivider = "/f263118493aa4ddf744b97a465c7848b9dfdfd71.svg";
const img = "/3d7e22780fd64c9c0429c5d00e76c258e58c0b74.svg";
const spinnerTrackImg = "/1490cc25bcae9c17d871e7f03ccf287c5e95c1ff.svg";
const spinnerActiveImg = "/6d7c7765c75b68e927a7594076a9c87616adea44.svg";
const deleteIcon = "/60b38394fbc983ca5bea78fb8488068119360ab4.svg";

const UploadPage: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [projects, setProjects] = useState<string[]>([]);
    const [uploadStatus, setUploadStatus] = useState<string>('No CSVs added');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const { getApiClient } = useAuthenticatedApi();

    const processFiles = (newFiles: File[]) => {
        setIsProcessing(true);
        setFiles(prevFiles => [...prevFiles, ...newFiles]);
        setProjects(prevProjects => [...prevProjects, ...new Array(newFiles.length).fill('')]);
        setUploadStatus(`${newFiles.length} file(s) added`);

        setTimeout(() => {
            setIsProcessing(false);
        }, 2000); // Simulate processing time
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (isProcessing) return;

        const droppedFiles = Array.from(event.dataTransfer.files);
        const csvFiles = droppedFiles.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
        console.log('*** csvFiles: ', csvFiles);
        if (csvFiles.length > 0) {
            processFiles(csvFiles);
        }
    }, [isProcessing]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isProcessing) return;

        const selectedFiles = Array.from(event.target.files || []);
        const csvFiles = selectedFiles.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));

        if (csvFiles.length > 0) {
            processFiles(csvFiles);
        }
    };

    const openFileDialog = () => {
        if (!isProcessing) {
            const input = document.getElementById('file-input') as HTMLInputElement;
            if (input) {
                input.click();
            }
        }
    }

    const handleDelete = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
        setProjects(projects.filter((_, i) => i !== index));
    };

    const handleProjectChange = (index: number, value: string) => {
        const newProjects = [...projects];
        newProjects[index] = value;
        setProjects(newProjects);
    };

    const handleGenerateReport = async () => {
        if (files.length === 0) {
            setUploadStatus('Please add at least one CSV file.');
            return;
        }

        setIsProcessing(true);
        setUploadStatus('Uploading files...');

        try {
            const apiClient = await getApiClient();
            const uploadResponse = await uploadVibrationData(apiClient, files, projects);

            if (uploadResponse.data && uploadResponse.data.start_date && uploadResponse.data.end_date && uploadResponse.data.device_ids) {
                setUploadStatus('Files uploaded successfully! Generating report...');
                const reportParams = {
                    start_date: uploadResponse.data.start_date,
                    end_date: uploadResponse.data.end_date,
                    device_ids: uploadResponse.data.device_ids,
                };
                await generateVibrationReport(apiClient, reportParams);
                setUploadStatus('Report generated successfully!');
            } else {
                setUploadStatus('Files uploaded, but missing data for report generation.');
            }
            setFiles([]);
            setProjects([]);
        } catch (error) {
            console.error('Error uploading files or generating report:', error);
            setUploadStatus('Error processing files or generating report. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const truncateFileName = (name: string, maxLength: number) => {
        if (name.length <= maxLength) {
            return name;
        }
        return name.substring(0, maxLength) + '...';
    };

    return (
        <div className={styles.uploadPage}>
            <div className={styles.navBar}>
                <div className={styles.navContainer}>
                    <div className={styles.menu}>
                        <img alt="menu" className={styles.menu} src={imgMenu} />
                    </div>
                    <div className={styles.logoContainer}>
                        <div className={styles.logo} style={{ backgroundImage: `url('${imgLogo}')` }} />
                    </div>
                </div>
                <div className={styles.divider}>
                    <img alt="divider" className={styles.divider} src={imgDivider} />
                </div>
                <div className={styles.button} onClick={handleGenerateReport}>
                    <div className={files.length > 0 ? styles.buttonContentActive : styles.buttonContent}>
                        <div className={files.length > 0 ? styles.buttonStateLayerActive : styles.buttonStateLayer}>
                            <div className={files.length > 0 ? styles.buttonLabelActive : styles.buttonLabel}>
                                <p>Generate Report</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.container}>
                <div className={styles.mainContent}>
                    <div className={styles.simpleForm}>
                        <div className={styles.title}>
                            <p>Upload CSV Files</p>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.fileAttachment}>
                                <div
                                    className={styles.attach}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={openFileDialog}
                                >
                                    <input type="file" id="file-input" multiple accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} disabled={isProcessing} />
                                    {isProcessing ? (
                                        <div className={styles.spinnerContainer}>
                                            <img alt="spinner track" className={styles.spinnerTrack} src={spinnerTrackImg} />
                                            <img alt="spinner active" className={styles.spinnerActive} src={spinnerActiveImg} />
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.uploadIcon}>
                                                <div className={styles.icon}>
                                                    <img alt="upload" className={styles.uploadIcon} src={img} />
                                                </div>
                                            </div>
                                            <div className={styles.dropzoneText}>
                                                <p>Drop CSV files here or click to upload</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className={styles.csvInfoContainer}>
                                    <div className={styles.csvInfoHeader}>
                                        <div className={styles.fileNameHeader}>
                                            <p>File Name</p>
                                        </div>
                                        <div className={styles.projectHeader}>
                                            <p>Project</p>
                                        </div>
                                    </div>
                                    {files.length === 0 ? (
                                        <div className={styles.csvStatusRow}>
                                            <div className={styles.noCsvStatus}>
                                                <p>{uploadStatus}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        files.map((file, index) => (
                                            <div key={index} className={styles.csvStatusRow}>
                                                <div className={styles.csvFileName}>
                                                    {truncateFileName(file.name, 30)}
                                                </div>
                                                <div className={styles.textField}>
                                                    <input type="text" className={styles.textInput} value={projects[index]} onChange={(e) => handleProjectChange(index, e.target.value)} />
                                                </div>
                                                <div className={styles.deleteIconContainer} onClick={() => handleDelete(index)}>
                                                    <img alt="delete" className={styles.deleteIcon} src={deleteIcon} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UploadPage;
