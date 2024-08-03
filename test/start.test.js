import { Component, OnInit } from '@angular/core';
 import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GlobalsService, } from 'src/app/shared/services';

@Component({
  selector: 'app-document-required',
  templateUrl: './document-required.component.html',
  styleUrls: ['./document-required.component.css']
})
export class DocumentRequiredComponent implements OnInit {
  isLoading: boolean;
  main_doc_data: Observable<any[]>;
  other_documents_data: Observable<any[]>;

  constructor(
     private globalsService: GlobalsService ) { }
 

  ngOnInit() {
    setTimeout(function() {window.scrollTo(0, 0);},1)
    this.isLoading = true;
    this.globalsService.page = 'document-required';
      this.globalsService.getDataFilter()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
       
          dataFilter => {
          var applicationDocs = dataFilter.main_doc_data

          this.main_doc_data = applicationDocs;
          this.other_documents_data = dataFilter.other_documents_data;
         
        }
      );

  }


}